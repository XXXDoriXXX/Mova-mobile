export { AuthHeroHeader } from "./AuthHeroHeader";
export { GoogleSignInButton } from "./GoogleSignInButton";
export { LoginForm } from "./LoginForm";
export { RegisterForm } from "./RegisterForm";

export { useLoginUseCase } from "./application/useLoginUseCase";
export { useRegisterUseCase } from "./application/useRegisterUseCase";
export { useGoogleSignInUseCase } from "./application/useGoogleSignInUseCase";
export { usePhoneVerification } from "./application/usePhoneVerification";
export { decideAuthRedirect } from "./application/decideAuthRedirect";

export type { LoginResult } from "./application/useLoginUseCase";
export type { RegisterResult } from "./application/useRegisterUseCase";
export type {
  AuthHydrationStatus,
  OnboardingHydrationStatus,
  AuthRedirectInput,
  AuthRedirectTarget,
} from "./application/decideAuthRedirect";
