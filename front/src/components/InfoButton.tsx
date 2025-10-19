import React from 'react';

const InfoButton: React.FC = () => {
  const handleInfoClick = () => {
    alert(
      "PM Accelerator: We help aspiring and current Product Managers build products, portfolios, and careers. Find us on LinkedIn under 'Product Manager Accelerator'."
    );
  };

  return (
    <button 
      onClick={handleInfoClick}
      className="info-button"
      title="About PM Accelerator"
    >
      ℹ︎ Info
    </button>
  );
};

export default InfoButton;
