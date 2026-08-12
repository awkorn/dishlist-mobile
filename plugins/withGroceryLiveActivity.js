const fs = require("fs");
const path = require("path");
const plistModule = require("@expo/plist");
const plist = plistModule.default ?? plistModule;
const {
  withEntitlementsPlist,
  withInfoPlist,
  withPlugins,
  withXcodeProject,
} = require("expo/config-plugins");

const TARGET_NAME = "DishListGroceryLiveActivity";

function getBundleIdentifier(config) {
  const appBundleIdentifier = config.ios?.bundleIdentifier;
  if (!appBundleIdentifier) {
    throw new Error(
      "withGroceryLiveActivity requires ios.bundleIdentifier in app.json"
    );
  }
  return `${appBundleIdentifier}.GroceryLiveActivity`;
}

function getAppGroup(config) {
  return (
    config.ios?.infoPlist?.AppGroup ||
    config.ios?.infoPlist?.AppGroupIdentifier ||
    `group.${config.ios.bundleIdentifier}`
  );
}

function withLiveActivityExpoConfig(config) {
  const bundleIdentifier = getBundleIdentifier(config);
  const appGroup = getAppGroup(config);
  const existingExtensions =
    config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? [];
  const existing = existingExtensions.find(
    (extension) => extension.targetName === TARGET_NAME
  );

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      eas: {
        ...(config.extra?.eas ?? {}),
        build: {
          ...(config.extra?.eas?.build ?? {}),
          experimental: {
            ...(config.extra?.eas?.build?.experimental ?? {}),
            ios: {
              ...(config.extra?.eas?.build?.experimental?.ios ?? {}),
              appExtensions: [
                ...existingExtensions.filter(
                  (extension) => extension.targetName !== TARGET_NAME
                ),
                {
                  ...(existing ?? {}),
                  targetName: TARGET_NAME,
                  bundleIdentifier,
                  entitlements: {
                    ...(existing?.entitlements ?? {}),
                    "com.apple.security.application-groups": [appGroup],
                  },
                },
              ],
            },
          },
        },
      },
    },
  };
}

function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (modConfig) => {
    modConfig.modResults.NSSupportsLiveActivities = true;

    const targetPath = path.join(
      modConfig.modRequest.platformProjectRoot,
      TARGET_NAME
    );
    fs.mkdirSync(targetPath, { recursive: true });
    fs.writeFileSync(
      path.join(targetPath, "Info.plist"),
      plist.build({
        CFBundleDevelopmentRegion: "$(DEVELOPMENT_LANGUAGE)",
        CFBundleDisplayName: "DishList Grocery",
        CFBundleExecutable: "$(EXECUTABLE_NAME)",
        CFBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)",
        CFBundleInfoDictionaryVersion: "6.0",
        CFBundleName: "$(PRODUCT_NAME)",
        CFBundlePackageType: "$(PRODUCT_BUNDLE_PACKAGE_TYPE)",
        CFBundleShortVersionString: "$(MARKETING_VERSION)",
        CFBundleVersion: "$(CURRENT_PROJECT_VERSION)",
        NSExtension: {
          NSExtensionPointIdentifier: "com.apple.widgetkit-extension",
        },
      })
    );

    return modConfig;
  });
}

function withLiveActivityEntitlements(config) {
  return withEntitlementsPlist(config, (modConfig) => {
    const targetPath = path.join(
      modConfig.modRequest.platformProjectRoot,
      TARGET_NAME
    );
    fs.mkdirSync(targetPath, { recursive: true });
    fs.writeFileSync(
      path.join(targetPath, `${TARGET_NAME}.entitlements`),
      plist.build({
        "com.apple.security.application-groups": [getAppGroup(modConfig)],
      })
    );
    return modConfig;
  });
}

function addTargetToProject(xcodeProject, config) {
  const targetPath = path.join(
    config.modRequest.platformProjectRoot,
    TARGET_NAME
  );
  fs.mkdirSync(targetPath, { recursive: true });

  const sourceFiles = [
    {
      source: path.join(
        config.modRequest.projectRoot,
        "modules/dishlist-live-activity/ios/GroceryLiveActivityAttributes.swift"
      ),
      name: "GroceryLiveActivityAttributes.swift",
    },
    {
      source: path.join(
        config.modRequest.projectRoot,
        "modules/dishlist-live-activity/ios/GroceryLiveActivityIntents.swift"
      ),
      name: "GroceryLiveActivityIntents.swift",
    },
    {
      source: path.join(
        config.modRequest.projectRoot,
        "plugins/grocery-live-activity/GroceryLiveActivityWidget.swift"
      ),
      name: "GroceryLiveActivityWidget.swift",
    },
  ];

  for (const file of sourceFiles) {
    fs.copyFileSync(file.source, path.join(targetPath, file.name));
  }

  // Keep generated native sources current when prebuild runs without --clean.
  if (xcodeProject.findTargetKey(TARGET_NAME)) {
    return;
  }

  const targetUuid = xcodeProject.generateUuid();
  const currentProjectVersion = config.ios?.buildNumber || "1";
  const marketingVersion = config.version || "1.0.0";
  const bundleIdentifier = getBundleIdentifier(config);

  const commonBuildSettings = {
    APPLICATION_EXTENSION_API_ONLY: "YES",
    CLANG_ENABLE_MODULES: "YES",
    CODE_SIGN_ENTITLEMENTS: `${TARGET_NAME}/${TARGET_NAME}.entitlements`,
    CODE_SIGN_STYLE: "Automatic",
    CURRENT_PROJECT_VERSION: `"${currentProjectVersion}"`,
    GENERATE_INFOPLIST_FILE: "NO",
    INFOPLIST_FILE: `${TARGET_NAME}/Info.plist`,
    IPHONEOS_DEPLOYMENT_TARGET: "16.1",
    LD_RUNPATH_SEARCH_PATHS:
      '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
    MARKETING_VERSION: `"${marketingVersion}"`,
    PRODUCT_BUNDLE_IDENTIFIER: `"${bundleIdentifier}"`,
    PRODUCT_NAME: `"${TARGET_NAME}"`,
    SKIP_INSTALL: "YES",
    SWIFT_EMIT_LOC_STRINGS: "YES",
    SWIFT_VERSION: "5.0",
    TARGETED_DEVICE_FAMILY: '"1,2"',
  };

  const configurationList = xcodeProject.addXCConfigurationList(
    [
      {
        name: "Debug",
        isa: "XCBuildConfiguration",
        buildSettings: {
          ...commonBuildSettings,
          SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
        },
      },
      {
        name: "Release",
        isa: "XCBuildConfiguration",
        buildSettings: commonBuildSettings,
      },
    ],
    "Release",
    `Build configuration list for PBXNativeTarget "${TARGET_NAME}"`
  );

  const productFile = xcodeProject.addProductFile(TARGET_NAME, {
    group: "Copy Files",
    explicitFileType: "wrapper.app-extension",
  });
  xcodeProject.addToPbxBuildFileSection(productFile);

  const target = {
    uuid: targetUuid,
    pbxNativeTarget: {
      isa: "PBXNativeTarget",
      name: TARGET_NAME,
      productName: TARGET_NAME,
      productReference: productFile.fileRef,
      productType: '"com.apple.product-type.app-extension"',
      buildConfigurationList: configurationList.uuid,
      buildPhases: [],
      buildRules: [],
      dependencies: [],
    },
  };

  xcodeProject.addToPbxNativeTargetSection(target);
  xcodeProject.addToPbxProjectSection(target);

  const project = xcodeProject.pbxProjectSection()[
    xcodeProject.getFirstProject().uuid
  ];
  project.attributes = project.attributes ?? {};
  project.attributes.TargetAttributes =
    project.attributes.TargetAttributes ?? {};
  project.attributes.TargetAttributes[targetUuid] = {
    CreatedOnToolsVersion: "16.0",
  };

  if (!xcodeProject.hash.project.objects.PBXTargetDependency) {
    xcodeProject.hash.project.objects.PBXTargetDependency = {};
  }
  if (!xcodeProject.hash.project.objects.PBXContainerItemProxy) {
    xcodeProject.hash.project.objects.PBXContainerItemProxy = {};
  }
  xcodeProject.addTargetDependency(xcodeProject.getFirstTarget().uuid, [
    targetUuid,
  ]);

  // Info.plist and entitlements are referenced through build settings. Keeping
  // them out of PBXGroup avoids node-xcode reusing the share extension's
  // same-named Info.plist file reference and producing a malformed project.
  const files = sourceFiles.map((file) => file.name);
  const { uuid: groupUuid } = xcodeProject.addPbxGroup(
    files,
    TARGET_NAME,
    TARGET_NAME
  );

  const groups = xcodeProject.hash.project.objects.PBXGroup;
  for (const key of Object.keys(groups)) {
    if (
      groupUuid &&
      !key.endsWith("_comment") &&
      groups[key].name === undefined &&
      groups[key].path === undefined
    ) {
      xcodeProject.addToPbxGroup(groupUuid, key);
    }
  }

  xcodeProject.addBuildPhase(
    sourceFiles.map((file) => file.name),
    "PBXSourcesBuildPhase",
    "Sources",
    targetUuid,
    "app_extension"
  );
  xcodeProject.addBuildPhase(
    [],
    "PBXFrameworksBuildPhase",
    "Frameworks",
    targetUuid,
    "app_extension"
  );
  xcodeProject.addBuildPhase(
    [],
    "PBXResourcesBuildPhase",
    "Resources",
    targetUuid,
    "app_extension"
  );

  const embedPhase = xcodeProject.addBuildPhase(
    [],
    "PBXCopyFilesBuildPhase",
    "Embed Grocery Live Activity",
    xcodeProject.getFirstTarget().uuid,
    "app_extension"
  );
  embedPhase.buildPhase.files.push({
    value: productFile.uuid,
    comment: `${productFile.basename} in Embed Grocery Live Activity`,
  });
}

function withLiveActivityTarget(config) {
  return withXcodeProject(config, (modConfig) => {
    addTargetToProject(modConfig.modResults, modConfig);
    return modConfig;
  });
}

module.exports = function withGroceryLiveActivity(config) {
  return withPlugins(withLiveActivityExpoConfig(config), [
    withLiveActivityInfoPlist,
    withLiveActivityEntitlements,
    withLiveActivityTarget,
  ]);
};
