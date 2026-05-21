import { View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  size?: number;
  /** Background circle colour. Defaults to the peach avatar tone. */
  background?: string;
};

/**
 * Smiling-face avatar from the design — a generic placeholder used in the
 * header when a real user photo is absent. The face geometry is the same
 * tiny SVG from the design canvas, rendered with react-native-svg.
 *
 * Sized by the `size` prop (the circle, eyes, smile and hair all scale
 * proportionally so it stays balanced from 28px to 64px).
 */
export function FaceAvatar({ size = 42, background }: Props) {
  const theme = useTheme();
  const bg = background ?? theme.colors.avatarPeach;
  const innerSize = size * 0.7;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Svg width={innerSize} height={innerSize} viewBox="0 0 32 32">
        <Circle cx={16} cy={13} r={9} fill={theme.colors.avatarSand} />
        <Ellipse cx={11.5} cy={13} rx={2.5} ry={2} fill={theme.colors.text} />
        <Ellipse cx={20.5} cy={13} rx={2.5} ry={2} fill={theme.colors.text} />
        <Path
          d="M12 18 Q16 21 20 18"
          stroke={theme.colors.text}
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M6 9 Q10 5 16 5 Q22 5 26 9 L26 11 Q24 8 20 8 Q17 8 16 10 Q15 8 12 8 Q8 8 6 11 Z"
          fill={theme.colors.text}
        />
      </Svg>
    </View>
  );
}
