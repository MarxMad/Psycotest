"use client";

import Image from "next/image";
import { LandingStaggerItem } from "./LandingReveal";
import styles from "./consultorio.module.css";

type Service = {
  title: string;
  text: string;
  image: string;
};

export function ServiceCards({ services }: { services: readonly Service[] }) {
  return (
    <>
      {services.map((s) => (
        <LandingStaggerItem key={s.title}>
          <article className={styles.serviceCard}>
            <div className={styles.serviceThumb}>
              <Image src={s.image} alt="" fill sizes="(max-width: 768px) 100vw, 25vw" className={styles.serviceImg} />
            </div>
            <div className={styles.serviceBody}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </article>
        </LandingStaggerItem>
      ))}
    </>
  );
}
