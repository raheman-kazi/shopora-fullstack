import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'medium', text = '' }) => {
  return (
    <div className="spinner-wrapper">
      <div className={`spinner-circle spinner-${size}`}>
        <div className="spinner-circle-inner"></div>
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default Spinner;