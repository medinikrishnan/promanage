import React from "react";

const PurpleLoader = () => {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Animated Purple Circles</title>
      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n    /* Page Setup */\n    body {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      height: 100vh;\n      background: #1a0033;\n      overflow: hidden;\n    }\n\n    /* Loader Wrapper */\n    .loader-wrapper {\n      position: relative;\n      width: 200px;\n      height: 200px;\n      animation: rotate-circle 10s linear infinite;\n    }\n\n    /* Loader Container */\n    .loader {\n      position: absolute;\n      top: 50%;\n      left: 50%;\n      transform: translate(-50%, -50%) rotate(45deg);\n      width: 96px;\n      height: 96px;\n    }\n\n    /* Animation Path */\n    @keyframes circle-animation {\n      0% { left: 0; top: 0; }\n      10.5% { left: 0; top: 0; }\n      12.5% { left: 32px; top: 0; }\n      23% { left: 32px; top: 0; }\n      25% { left: 64px; top: 0; }\n      35.5% { left: 64px; top: 0; }\n      37.5% { left: 64px; top: 32px; }\n      48% { left: 64px; top: 32px; }\n      50% { left: 32px; top: 32px; }\n      60.5% { left: 32px; top: 32px; }\n      62.5% { left: 32px; top: 64px; }\n      73% { left: 32px; top: 64px; }\n      75% { left: 0; top: 64px; }\n      85.5% { left: 0; top: 64px; }\n      87.5% { left: 0; top: 32px; }\n      98% { left: 0; top: 32px; }\n      100% { left: 0; top: 0; }\n    }\n\n    /* Moving Circles */\n    .loader-circle {\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: 28px;\n      height: 28px;\n      margin: 2px;\n      border-radius: 50%;\n      background: linear-gradient(135deg, #8a2be2, #4b0082);\n      box-shadow: 0 4px 10px rgba(138, 43, 226, 0.6);\n      animation: circle-animation 10s ease-in-out infinite both;\n    }\n\n    /* Delay for each circle */\n    .loader-circle:nth-child(1) { animation-delay: 0s; }\n    .loader-circle:nth-child(2) { animation-delay: -1.428s; }\n    .loader-circle:nth-child(3) { animation-delay: -2.857s; }\n    .loader-circle:nth-child(4) { animation-delay: -4.285s; }\n    .loader-circle:nth-child(5) { animation-delay: -5.714s; }\n    .loader-circle:nth-child(6) { animation-delay: -7.142s; }\n    .loader-circle:nth-child(7) { animation-delay: -8.571s; }\n    .loader-circle:nth-child(8) { animation-delay: -10s; }\n\n    /* Entire Loader Circular Motion */\n    @keyframes rotate-circle {\n      0% { transform: rotate(0deg); }\n      100% { transform: rotate(360deg); }\n    }\n  "
        }}
      />
      <div className="loader-wrapper">
        <div className="loader">
          <div className="loader-circle" />
          <div className="loader-circle" />
          <div className="loader-circle" />
          <div className="loader-circle" />
          <div className="loader-circle" />
          <div className="loader-circle" />
          <div className="loader-circle" />
          <div className="loader-circle" />
        </div>
      </div>
    </>
  );
};

export default PurpleLoader;