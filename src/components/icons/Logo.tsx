import { useTheme } from 'styled-components';

interface LogoProps {
  showName?: boolean;
  height?: number;
}

export function Logo({ showName = false, height = 41 }: LogoProps) {
  const theme = useTheme();

  return (
    <svg
      height={height}
      viewBox={showName ? '0 0 142 41' : '0 0 41 41'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.1889 40.5C31.3388 40.5 40.3778 31.5457 40.3778 20.5C40.3778 9.45431 31.3388 0.5 20.1889 0.5C9.03886 0.5 0 9.45431 0 20.5C0 31.5457 9.03886 40.5 20.1889 40.5ZM14.0887 29.5609H9.35258C8.22968 29.5609 7.6682 29.5609 7.33194 29.3454C6.96854 29.1127 6.73925 28.722 6.71498 28.2943C6.69245 27.8984 6.97054 27.4157 7.52672 26.4505L7.52697 26.4502L17.8964 8.45394C18.4608 7.47441 18.743 6.98464 19.1021 6.80232C19.49 6.60536 19.95 6.60502 20.3382 6.80145C20.6975 6.98322 20.9804 7.47261 21.5462 8.45128L23.9378 12.5878V12.5879C24.3493 13.2995 24.5549 13.6554 24.6455 14.0308C24.7439 14.4395 24.7441 14.8653 24.6461 15.274C24.5559 15.6495 24.3504 16.0056 23.9396 16.7176L17.7388 27.4638C17.322 28.1862 17.1135 28.5475 16.8279 28.8175C16.5171 29.1114 16.1401 29.328 15.7281 29.4494C15.3495 29.5609 14.9293 29.5609 14.0887 29.5609ZM30.9858 29.5609H25.4948C24.3618 29.5609 23.7951 29.5609 23.4578 29.3436C23.0933 29.1088 22.8648 28.7152 22.8432 28.2854C22.8233 27.8876 23.1084 27.4029 23.6787 26.4338L26.4196 21.7752C26.9827 20.8183 27.2643 20.3399 27.6207 20.1606C28.0059 19.967 28.4614 19.9666 28.847 20.1597C29.2038 20.3384 29.4859 20.8165 30.0503 21.7725L30.0504 21.7728L32.8005 26.4312C33.373 27.401 33.6591 27.8859 33.6396 28.284C33.6184 28.7142 33.39 29.1082 33.0253 29.3433C32.688 29.5609 32.1206 29.5609 30.9858 29.5609Z"
        fill={theme.colors.icon1}
      />
      {showName && (
        <path
          d="M59.3789 16.6602C58.8581 16.1002 58.3506 15.7269 57.8566 15.5402C57.3758 15.3535 56.8884 15.2602 56.3943 15.2602C55.6598 15.2602 54.9922 15.3935 54.3913 15.6602C53.8037 15.9135 53.2962 16.2735 52.8689 16.7402C52.4416 17.1935 52.1078 17.7269 51.8674 18.3402C51.6403 18.9535 51.5269 19.6135 51.5269 20.3202C51.5269 21.0802 51.6403 21.7802 51.8674 22.4202C52.1078 23.0602 52.4416 23.6135 52.8689 24.0802C53.2962 24.5469 53.8037 24.9135 54.3913 25.1802C54.9922 25.4469 55.6598 25.5802 56.3943 25.5802C56.9685 25.5802 57.5227 25.4469 58.0569 25.1802C58.6043 24.9002 59.1118 24.4602 59.5792 23.8602L61.6624 25.3402C61.0214 26.2202 60.2402 26.8602 59.3188 27.2602C58.3974 27.6602 57.4159 27.8602 56.3743 27.8602C55.2792 27.8602 54.2711 27.6869 53.3497 27.3402C52.4416 26.9802 51.6537 26.4802 50.986 25.8402C50.3316 25.1869 49.8175 24.4069 49.4437 23.5002C49.0697 22.5935 48.8828 21.5869 48.8828 20.4802C48.8828 19.3469 49.0697 18.3202 49.4437 17.4002C49.8175 16.4669 50.3316 15.6735 50.986 15.0202C51.6537 14.3669 52.4416 13.8669 53.3497 13.5202C54.2711 13.1602 55.2792 12.9802 56.3743 12.9802C57.3358 12.9802 58.2237 13.1535 59.0384 13.5002C59.8663 13.8335 60.6341 14.4069 61.3419 15.2202L59.3789 16.6602ZM66.4011 20.4802C66.4011 19.3469 66.588 18.3202 66.9619 17.4002C67.3358 16.4669 67.8499 15.6735 68.5043 15.0202C69.1719 14.3669 69.9598 13.8669 70.8679 13.5202C71.7893 13.1602 72.7975 12.9802 73.8926 12.9802C75.0009 12.9669 76.0158 13.1335 76.9372 13.4802C77.8586 13.8135 78.6532 14.3069 79.3209 14.9602C79.9885 15.6135 80.5093 16.4002 80.8833 17.3202C81.2571 18.2402 81.4441 19.2669 81.4441 20.4002C81.4441 21.5069 81.2571 22.5135 80.8833 23.4202C80.5093 24.3269 79.9885 25.1069 79.3209 25.7602C78.6532 26.4135 77.8586 26.9269 76.9372 27.3002C76.0158 27.6602 75.0009 27.8469 73.8926 27.8602C72.7975 27.8602 71.7893 27.6869 70.8679 27.3402C69.9598 26.9802 69.1719 26.4802 68.5043 25.8402C67.8499 25.1869 67.3358 24.4069 66.9619 23.5002C66.588 22.5935 66.4011 21.5869 66.4011 20.4802ZM69.0451 20.3202C69.0451 21.0802 69.1586 21.7802 69.3856 22.4202C69.626 23.0602 69.9598 23.6135 70.3872 24.0802C70.8144 24.5469 71.3219 24.9135 71.9095 25.1802C72.5104 25.4469 73.1781 25.5802 73.9126 25.5802C74.647 25.5802 75.3147 25.4469 75.9157 25.1802C76.5166 24.9135 77.0307 24.5469 77.458 24.0802C77.8853 23.6135 78.2125 23.0602 78.4395 22.4202C78.6799 21.7802 78.8001 21.0802 78.8001 20.3202C78.8001 19.6135 78.6799 18.9535 78.4395 18.3402C78.2125 17.7269 77.8853 17.1935 77.458 16.7402C77.0307 16.2735 76.5166 15.9135 75.9157 15.6602C75.3147 15.3935 74.647 15.2602 73.9126 15.2602C73.1781 15.2602 72.5104 15.3935 71.9095 15.6602C71.3219 15.9135 70.8144 16.2735 70.3872 16.7402C69.9598 17.1935 69.626 17.7269 69.3856 18.3402C69.1586 18.9535 69.0451 19.6135 69.0451 20.3202ZM87.6537 13.3402H92.5813C93.2624 13.3402 93.9168 13.4069 94.5443 13.5402C95.1853 13.6602 95.7529 13.8735 96.2469 14.1802C96.7411 14.4869 97.135 14.9002 97.4287 15.4202C97.7226 15.9402 97.8694 16.6002 97.8694 17.4002C97.8694 18.4269 97.5824 19.2869 97.0081 19.9802C96.4472 20.6735 95.6394 21.0935 94.5844 21.2402L98.3501 27.5002H95.3055L92.0204 21.5002H90.1776V27.5002H87.6537V13.3402ZM92.1406 19.3402C92.5012 19.3402 92.8617 19.3269 93.2223 19.3002C93.5828 19.2602 93.91 19.1802 94.2038 19.0602C94.511 18.9269 94.758 18.7335 94.9449 18.4802C95.1319 18.2135 95.2254 17.8469 95.2254 17.3802C95.2254 16.9669 95.1386 16.6335 94.965 16.3802C94.7914 16.1269 94.5643 15.9402 94.2839 15.8202C94.0035 15.6869 93.6897 15.6002 93.3425 15.5602C93.0087 15.5202 92.6815 15.5002 92.361 15.5002H90.1776V19.3402H92.1406ZM104.076 13.3402H113.471V15.6202H106.6V19.1002H113.11V21.3802H106.6V25.2202H113.831V27.5002H104.076V13.3402ZM133.326 20.1002L128.599 13.3402H131.784L135.129 18.5802L138.434 13.3402H141.499L136.851 20.1002L141.999 27.5002H138.794L135.049 21.5202L131.323 27.5002H128.278L133.326 20.1002Z"
          fill={theme.colors.icon1}
        />
      )}
    </svg>
  );
}
