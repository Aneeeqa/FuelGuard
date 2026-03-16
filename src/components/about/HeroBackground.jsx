import Dither from '../Dither';

const HeroBackground = () => {
  return (
    <div className="fixed inset-0 z-0">
      <Dither
        waveSpeed={0.00001}
        waveFrequency={0.5}
        waveAmplitude={0.01}
        waveColor={[0.149, 0.388, 0.922]}
        colorNum={1}
        pixelSize={3}
        opacity={0.0375}
        enableMouseInteraction={true}
        mouseRadius={0.025}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/50 via-[#141416]/70 to-[#1C1C1F] pointer-events-none" />
    </div>
  );
};

export default HeroBackground;
