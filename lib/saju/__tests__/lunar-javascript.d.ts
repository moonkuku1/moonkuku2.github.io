// 검증 전용 라이브러리(lunar-javascript)에는 타입 정의가 없어서 필요한 부분만 적어 둔다.
declare module "lunar-javascript" {
  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): {
      getLunar(): {
        getEightChar(): {
          setSect(sect: number): void;
          getYear(): string;
          getMonth(): string;
          getDay(): string;
          getTime(): string;
        };
      };
    };
  };
}
