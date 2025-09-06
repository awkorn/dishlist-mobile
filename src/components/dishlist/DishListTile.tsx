import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Eye, Lock, Crown, Users, Heart } from 'lucide-react-native';
import { typography } from '../../styles/typography';

interface DishListTileProps {
  dishList: {
    id: string;
    title: string;
    recipeCount: number;
    isDefault: boolean;
    isOwner: boolean;
    isCollaborator: boolean;
    isFollowing: boolean;
    visibility: 'PUBLIC' | 'PRIVATE';
  };
}

const { width } = Dimensions.get('window');
const tileWidth = (width - 60) / 2; 

export default function DishListTile({ dishList }: DishListTileProps) {
  const getBadges = () => {
    const badges = [];

    // Ownership badges
    if (dishList.isOwner) {
      badges.push({ type: 'owner', icon: Crown, color: '#F59E0B' });
    } else if (dishList.isCollaborator) {
      badges.push({ type: 'collaborator', icon: Users, color: '#10B981' });
    } else if (dishList.isFollowing) {
      badges.push({ type: 'following', icon: Heart, color: '#EF4444' });
    }

    // Visibility badges
    if (dishList.visibility === 'PUBLIC') {
      badges.push({ type: 'public', icon: Eye, color: '#6B7280' });
    } else {
      badges.push({ type: 'private', icon: Lock, color: '#6B7280' });
    }

    return badges;
  };

  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {dishList.title}
        </Text>
        
        <Text style={styles.recipeCount}>
          {dishList.recipeCount} {dishList.recipeCount === 1 ? 'recipe' : 'recipes'}
        </Text>

        <View style={styles.badges}>
          {getBadges().map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <View key={`${badge.type}-${index}`} style={styles.badge}>
                <IconComponent size={12} color={badge.color} />
              </View>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: tileWidth,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  title: {
    ...typography.subtitle,
    color: '#00295B',
    marginBottom: 4,
    minHeight: 48,
  },
  recipeCount: {
    ...typography.body,
    color: '#666',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
});