import {Composition} from 'remotion';
import {Deck} from './Deck';

const TOTAL_SLIDES = 9;
const FRAMES_PER_SLIDE = 180; // 6s at 30fps

export const Root = () => (
  <Composition
    id="PontePay"
    component={Deck}
    durationInFrames={TOTAL_SLIDES * FRAMES_PER_SLIDE}
    fps={30}
    width={1920}
    height={1080}
  />
);
