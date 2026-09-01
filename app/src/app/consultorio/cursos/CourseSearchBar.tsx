"use client";

import c from "./cursos.module.css";

export function CourseSearchBar() {
  return (
    <form
      className={c.searchBar}
      onSubmit={(e) => e.preventDefault()}
      role="search"
    >
      <span className={c.searchIcon} aria-hidden>
        ⌕
      </span>
      <input type="search" placeholder="¿Qué quieres aprender?" aria-label="Buscar cursos" />
    </form>
  );
}
