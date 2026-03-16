import Dither from '../Dither';

const OrangeHeroBackground = () => {
  return (
    <div className="fixed inset-0 z-0">
      <Dither
        waveSpeed={0.00001}
        waveFrequency={0.5}
        waveAmplitude={0.01}
        waveColor={[0.58, 0.22, 0.01]}
        colorNum={1}
        pixelSize={3}
        enableMouseInteraction={true}
        mouseRadius={0.025}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,5,0,0.55) 0%, rgba(18,7,0,0.72) 50%, #190800 100%)',
        }}
      />
    </div>
  );
};

export default OrangeHeroBackground;
