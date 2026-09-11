export const WET_HOVER_ANIMATIONS = ['none', 'fade', 'slide-up', 'slide-down', 'zoom', 'bounce', 'flip'];
export const WET_ALWAYS_ANIMATIONS = ['none', 'float', 'breathe', 'glow'];

export const getWetAnimationClass = (attrs) => {
    const always = attrs.labelDisplay === 'always';
    const options = always ? WET_ALWAYS_ANIMATIONS : WET_HOVER_ANIMATIONS;
    const fallback = always ? 'none' : 'fade';
    const value = always ? attrs.alwaysAnimation : attrs.hoverAnimation;
    return `wet-${always ? 'loop' : 'enter'}-${options.includes(value) ? value : fallback}`;
};
