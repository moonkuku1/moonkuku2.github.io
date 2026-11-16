/**
 * 서버가 만든 공유 이미지를 받아서, 휴대폰에서는 공유 창을 열고 안 되면 내려받게 한다.
 * 생년월일은 요청 본문(POST)으로만 보내고 주소에는 넣지 않는다.
 * 공유 창을 사용자가 닫은 경우는 오류로 보지 않고 조용히 끝낸다.
 */
export async function shareImage(url: string, body: unknown, filename: string, title: string): Promise<void> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "이미지를 만들지 못했어요.");
  const blob = await res.blob();
  const file = new File([blob], filename, { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return;
    }
  } catch (err) {
    if ((err as DOMException).name === "AbortError") return;
    // 공유가 안 되는 환경이면 내려받기로 넘어간다
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}
