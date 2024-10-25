import { FC, ReactNode, useEffect, useState } from "react";
import { ApolloClient, ApolloProvider } from "@apollo/client";
import Keycloak, { KeycloakInstance } from "keycloak-js";
import { cache } from "@/shared/api/graphql/cache";
import { Loader } from "@/shared/ui/Loader";
import { UserInfo } from "@/entities/User";
import { useAppStore } from "@/app/model/AppStore";

interface ApiProviderProps {
	children: ReactNode;
}

export const ApiProvider: FC<ApiProviderProps> = ({ children }) => {
	const [authenticated, setAuthenticated] = useState<boolean>(false);
	const [userInfo, setUserInfo] = useState<UserInfo>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { apollo, keycloak, setApollo, setKeycloak } = useAppStore();

	const initClient = async (keycloak: KeycloakInstance) => {
		if (!apollo) {
			return new ApolloClient({
				cache: cache,
				uri: import.meta.env.NODE_ENV !== "production" ? import.meta.env.VITE_DS_ENDPOINT : "/graphql",
				headers: {
					Authorization: "Bearer " + keycloak.token,
				},
			});
		}
	};

	useEffect(() => {
		setIsLoading(true);
		const appoloClientInit = async (keycloak: Keycloak.KeycloakInstance) => {
			const apolloClient = await initClient(keycloak);

			setApollo(apolloClient!);
		};

		keycloak!.init({ onLoad: "login-required" }).then(async (auth) => {
			console.log(auth);
			setKeycloak(keycloak!);
			setAuthenticated(auth);

			await appoloClientInit(keycloak!);

			if (!userInfo) {
				keycloak!.loadUserInfo().then((value) => {
					console.log(value);
					// @ts-ignore
					setUserInfo(Object.assign(value, keycloak?.resourceAccess![keycloak.clientId!]));
				});
			}
		});
		setIsLoading(false);
	}, []);

	if (!isLoading && authenticated) {
		return <ApolloProvider client={apollo!}>{children}</ApolloProvider>;
	}
	return (
		<Loader
			style={{
				margin: 0,
				position: "absolute",
				top: "45%",
				left: "45%",
			}}
		/>
	);
};
