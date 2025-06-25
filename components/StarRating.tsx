import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  showEmptyStars?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 24,
  color = '#FFD700',
  disabled = false,
  showEmptyStars = true,
}) => {
  const handleStarPress = (starIndex: number) => {
    if (!disabled && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index < rating;
    const isEmpty = index >= rating;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(index)}
        disabled={disabled}
        style={styles.starContainer}
      >
        <Feather
          name="star"
          size={size}
          color={isFilled ? color : (showEmptyStars ? '#E0E0E0' : 'transparent')}
          style={[
            isFilled && styles.filledStar,
            isEmpty && showEmptyStars && styles.emptyStar,
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    padding: 2,
  },
  filledStar: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyStar: {
    opacity: 0.3,
  },
});

export default StarRating; 