import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

export default function TontineLogo({ size = 120 }: { size?: number }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Background Circle */}
        <Circle cx="100" cy="100" r="95" fill="#4F46E5" />
        
        {/* Inner decorative circle */}
        <Circle cx="100" cy="100" r="85" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
        
        {/* Hands/People forming a circle - representing unity and cooperation */}
        <G fill="#FFFFFF">
          {/* Left person/hand */}
          <Circle cx="60" cy="80" r="15" />
          <Path d="M 60 95 L 60 130" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
          <Path d="M 60 110 Q 80 110 85 100" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" fill="none" />
          
          {/* Right person/hand */}
          <Circle cx="140" cy="80" r="15" />
          <Path d="M 140 95 L 140 130" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
          <Path d="M 140 110 Q 120 110 115 100" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" fill="none" />
          
          {/* Center coin/money symbol */}
          <Circle cx="100" cy="140" r="25" fill="#FFFFFF" opacity="0.9" />
          <Path d="M 100 125 L 100 155 M 85 135 Q 100 125 115 135 M 85 145 Q 100 155 115 145" 
                stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" fill="none" />
        </G>
        
        {/* Top text arc suggestion - SCDT */}
        <Path d="M 70 50 Q 100 35 130 50" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity="0.5" />
        
        {/* Bottom decorative elements */}
        <Circle cx="50" cy="160" r="5" fill="#FFFFFF" opacity="0.5" />
        <Circle cx="150" cy="160" r="5" fill="#FFFFFF" opacity="0.5" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
