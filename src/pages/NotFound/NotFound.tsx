import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <main className={styles.notFound}>
      {/* <h1 className={styles.title}>404</h1> */}
      <svg
        className={styles.face}
        viewBox="0 0 320 380"
        width="320"
        height="380"
        aria-label="A 404 becomes a face, looks to the sides, and blinks."
        role="img"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="25"
        >
          <g className={styles.faceEyes} transform="translate(0, 112.5)">
            <g transform="translate(15, 0)">
              <polyline
                className={styles.faceEyeLid}
                points="37,0 0,120 75,120"
              />

              <polyline
                className={styles.facePupil}
                points="55,120 55,155"
                strokeDasharray="35 35"
              />
            </g>

            <g transform="translate(230, 0)">
              <polyline
                className={styles.faceEyeLid}
                points="37,0 0,120 75,120"
              />

              <polyline
                className={styles.facePupil}
                points="55,120 55,155"
                strokeDasharray="35 35"
              />
            </g>
          </g>

          <rect
            className={styles.faceNose}
            rx="4"
            ry="4"
            x="132.5"
            y="112.5"
            width="55"
            height="155"
          />

          <g strokeDasharray="102 102" transform="translate(65, 334)">
            <path
              className={styles.faceMouthLeft}
              d="M 0 30 C 0 30 40 0 95 0"
              strokeDashoffset="-102"
            />

            <path
              className={styles.faceMouthRight}
              d="M 95 0 C 150 0 190 30 190 30"
              strokeDashoffset="102"
            />
          </g>
        </g>
      </svg>
      <p className={styles.text}>Looks like this face lost its page.</p>
      <Link className={styles.link} to="/">
        Back to Home
      </Link>
    </main>
  );
}
