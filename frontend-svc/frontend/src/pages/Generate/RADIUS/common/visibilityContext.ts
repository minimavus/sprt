import { createContext, use } from "react";

type VisibilityContextProps = {
	visible: boolean;
};

export const VisibilityContext = createContext<VisibilityContextProps>(
	undefined as unknown as VisibilityContextProps,
);

export const useIsVisible = () => {
	const context = use(VisibilityContext);
	if (!context) {
		throw new Error("useIsVisible must be used within a VisibilityProvider");
	}
	return context.visible;
};
