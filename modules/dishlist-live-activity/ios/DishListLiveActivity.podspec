require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'DishListLiveActivity'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = { :type => 'MIT' }
  s.author         = 'DishList'
  s.homepage       = 'https://dishlists.app'
  s.platform       = :ios, '15.1'
  s.swift_version  = '5.4'
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.weak_frameworks = 'ActivityKit', 'AppIntents'
  s.source_files = '**/*.{h,m,swift}'
end
