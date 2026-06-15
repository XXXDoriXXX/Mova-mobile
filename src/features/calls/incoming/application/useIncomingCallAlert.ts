import { useEffect } from "react";
import { Vibration } from "react-native";

// Ring cadence: pause, buzz, gap, buzz — repeated until cancelled.
const RING_PATTERN = [0, 600, 400, 600];

/**
 * Continuous vibration alert while an incoming call is ringing. The primary
 * (deaf/mute) user cannot hear the ringtone, so a looping haptic pattern is how
 * they perceive an incoming call at all. Stops the moment the call is answered /
 * declined / dismissed (active=false) or the screen unmounts.
 */
export function useIncomingCallAlert(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    Vibration.vibrate(RING_PATTERN, true);
    return () => {
      Vibration.cancel();
    };
  }, [active]);
}
