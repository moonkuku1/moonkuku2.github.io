/**
 * 홈에서 입력한 생년월일을 이 탭 안에서만(sessionStorage) 이어 쓰는 도구.
 * 탭을 닫으면 사라지고, 서버에는 요청 본문으로만 보낸다. 주소(URL)에는 절대 넣지 않는다(요구사항 7.3).
 */
export type Form = { calendar: "solar" | "lunar"; year: string; month: string; day: string; leap: boolean; time: string; gender: "" | "male" | "female" };
export const EMPTY_FORM: Form = { calendar: "solar", year: "", month: "", day: "", leap: false, time: "", gender: "" };
export const ME_KEY = "saju300-me";

/** 서버에 보내는 값 */
export function birthBody(form: Form) {
  const [hh, mm] = form.time ? form.time.split(":").map(Number) : [null, 0];
  return {
    calendar: form.calendar,
    year: Number(form.year),
    month: Number(form.month),
    day: Number(form.day),
    leap: form.calendar === "lunar" ? form.leap : undefined,
    hour: hh,
    minute: mm,
    gender: form.gender,
  };
}

export function isComplete(form: Form): boolean {
  return !!form.year && !!form.month && !!form.day && !!form.gender;
}

/** 이 탭에 저장된 입력값(없거나 덜 채워졌으면 null) */
export function savedForm(): Form | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ME_KEY) ?? "null");
    if (!saved?.form) return null;
    const form = { ...EMPTY_FORM, ...saved.form } as Form;
    return isComplete(form) ? form : null;
  } catch {
    return null;
  }
}

/** 견본 풀이(/r/sample)에서 쓰는 가상의 사람. 실제 사람의 정보가 아니다. */
export const DEMO_FORM: Form = { calendar: "solar", year: "2000", month: "1", day: "1", leap: false, time: "00:30", gender: "male" };
