// src/utils/colors.ts

/**
 * 주어진 hex 색상 코드의 명도를 계산하여
 * 가장 대비가 좋은 텍스트 색상(검은색 또는 흰색)을 반환합니다.
 * @param hexColor 예: '#RRGGBB'
 * @returns '#000000' 또는 '#FFFFFF'
 */
export function getContrastingTextColor(hexColor: string): string {

  // 1. 함수가 어떤 색상 값을 입력받았는지 확인
  console.log('입력된 색상:', hexColor);

  if (!hexColor || typeof hexColor !== 'string') {
    console.error('잘못된 색상 값이 들어왔습니다. 검은색을 반환합니다.');
    return '#000000';
  }

  // hex 코드에서 '#' 제거
  const cleanHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

  if (cleanHex.length !== 6) {
    console.error('hex 코드는 6자리여야 합니다. 검은색을 반환합니다.');
    return '#000000';
  }

  // hex를 R, G, B 값으로 변환
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // WCAG 2.0 표준에 따른 상대 휘도(Luminance) 계산
  // https://www.w3.org/TR/WCAG20/#relativeluminance
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  // 명도 임계값 (0.5는 일반적인 기준점)
  // 명도가 0.5보다 크면 '밝은 색'으로 간주하여 어두운 텍스트를,
  // 그렇지 않으면 '어두운 색'으로 간주하여 밝은 텍스트를 반환합니다.
  const resultColor = luminance > 0.5 ? '#000000' : '#FFFFFF';

  // 2. 계산 결과와 반환될 색상을 확인
  console.log(`휘도: ${luminance.toFixed(2)}, 결정된 글자색: ${resultColor}`);

  return resultColor;
}

/**
 * 랜덤 hex 색상 코드를 생성합니다.
 * 너무 밝거나 어두운 색을 피하기 위해 각 채널의 범위를 제한합니다.
 * @returns 예: '#A4C8F0'
 */
export function generateRandomHexColor(): string {
  let color = '#';
  for (let i = 0; i < 3; i++) {
    // 50 ~ 200 사이의 값을 생성하여 너무 극단적인 색상을 피합니다.
    const random = Math.floor(Math.random() * 150) + 50;
    color += ('0' + random.toString(16)).slice(-2);
  }
  return color;
}