/* eslint-disable react/prop-types */
// queuesmart wordmark: three leaning bars + name with a red period
export default function Logo({ size = 26 }) {
  return (
    <span className="logo" style={{ fontSize: size }}>
      <svg className="logo-mark" viewBox="0 0 28 30" aria-hidden="true">
        <g transform="skewX(-14) translate(5 0)" fill="#d71e1e">
          <rect x="0" y="16" width="5.5" height="13" rx="2.7" />
          <rect x="9" y="9" width="5.5" height="20" rx="2.7" />
          <rect x="18" y="1" width="5.5" height="28" rx="2.7" />
        </g>
      </svg>
      <span className="logo-word">
        <b>queue</b>smart<i>.</i>
      </span>
    </span>
  );
}
