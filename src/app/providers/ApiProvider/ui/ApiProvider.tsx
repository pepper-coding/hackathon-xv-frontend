import { FC, ReactNode, useEffect, useState } from "react";
import { ApolloClient, ApolloProvider } from "@apollo/client";
import Keycloak, { KeycloakInstance } from "keycloak-js";
import { cache } from "@/shared/api/graphql/cache";
import { useUserStore } from "@/entities/User";
import { useAppStore } from "@/app/model/AppStore";
import { Layout, Spin } from "antd";

interface ApiProviderProps {
	children: ReactNode;
}

export const ApiProvider: FC<ApiProviderProps> = ({ children }) => {
	const [authenticated, setAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { apollo, keycloak, setApollo, setKeycloak } = useAppStore();
	const { setUserInfo, userInfo } = useUserStore();

	const initClient = async (keycloak: KeycloakInstance) => {
		if (!apollo) {
			return new ApolloClient({
				cache: cache,
				uri: import.meta.env.VITE_NODE_ENV === "prod" ? import.meta.env.VITE_DS_ENDPOINT : "/graphql",
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
			setKeycloak(keycloak!);
			setAuthenticated(auth);

			await appoloClientInit(keycloak!);

			if (!userInfo) {
				keycloak!.loadUserInfo().then((value) => {
					// @ts-ignore
					setUserInfo({ ...value, role: keycloak?.resourceAccess[keycloak.realm].roles[0] });
				});
			}
		});
		setIsLoading(false);
	}, []);

	if (!isLoading && authenticated) {
		return <ApolloProvider client={apollo!}>{children}</ApolloProvider>;
	}
	return (
		<Layout>
			<Spin
				size="large"
				style={{
					margin: 0,
					position: "absolute",
					top: "45%",
					left: "45%",
				}}
			/>
		</Layout>
	);
};
