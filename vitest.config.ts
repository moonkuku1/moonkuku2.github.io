import { defineConfig } from "vitest/config";

// 만세력 대조처럼 수천 건을 도는 시험이 컴퓨터가 바쁠 때 5초를 넘기지 않도록 넉넉하게 둔다.
export default defineConfig({
  test: { testTimeout: 30_000 },
});
