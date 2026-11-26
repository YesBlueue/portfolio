"use client";

/** Footer link that knits the sweater back up and shows the intro again. */
export function ReKnit() {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.removeItem("knit");
        } catch {}
        window.location.assign(window.location.pathname);
      }}
      style={{ all: "unset", cursor: "var(--cur-pointer)", textDecoration: "underline", textUnderlineOffset: 3 }}
    >
      Knit it back up
    </button>
  );
}
