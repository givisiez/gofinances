import 
  React,{
    createContext,
    ReactNode,
    useContext,
    useState,
    useEffect
  }
from 'react';

const { CLIENT_ID } = process.env;
const { REDIRECT_URI } = process.env;

import * as AuthSession from 'expo-auth-session';

// import * as Google from 'expo-google-app-auth';
import AsyncStorage  from '@react-native-async-storage/async-storage';

import * as AppleAuthentication from 'expo-apple-authentication';

interface IAuthProviderProps {
  children: ReactNode;
}

interface IUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface IAauthConterxtData {
  user: IUser; 
  signInWithGoogle():  Promise<void>;
  signInWithApple():  Promise<void>;
}

interface IAuthorizationResponse {
  params: {
    access_token: string;
  };
  type: string;
}

const AuthContext = createContext({} as IAauthConterxtData);

function AuthProvider({ children } :  IAuthProviderProps){
  const [user, setUser] = useState<IUser>({} as IUser);
  const [userStorageLoading, setUserStorageLoading] = useState(true);

  const userSotageKey = '@gofinances:user';

  async function signInWithGoogle() {
    try {
      const RESPONSE_TYPE = 'token';
      const SCOPE = encodeURI('profile email');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;

      const {type, params} = await AuthSession
      .startAsync( { authUrl } ) as IAuthorizationResponse;
      
      if(type === 'success') {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`);
        const userInfo = await response.json();

        const userLogged = {
          id: String(userInfo.id),
          email: userInfo.email,
          name: userInfo.given_name,
          photo: userInfo.picture
        }
        setUser(userLogged);
        await AsyncStorage.setItem(userSotageKey, JSON.stringify(userLogged));

        console.log(user);
      }
    } catch (error) {
     throw new Error(error);
    }

  }

  async function signInWithApple() {    
    try{
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ]
      });

      if(credential){
        const userLogged = {
          id: String(credential.user),
          email: credential.email!,
          name: credential.fullName?.givenName!,
          photo: undefined,
        }
        setUser(userLogged);
        await AsyncStorage.setItem(userSotageKey, JSON.stringify(userLogged));
      }


    } catch (error) {
      throw new Error(error);
    }
  }

  useEffect(() => {
    async function loadUserStorageDate() {
      const userStoraged = await AsyncStorage.getItem(userSotageKey);

      if(userStoraged){
        const userLogged = JSON.parse(userStoraged) as IUser;
        setUser(userLogged);
      }

      setUserStorageLoading(false);
    }

    loadUserStorageDate();
  }, []);

  return (
    <AuthContext.Provider value={{
      user, 
      signInWithGoogle,
      signInWithApple
    }}>
      { children }
    </AuthContext.Provider>
  );
}

 function useAuth(){
   const context = useContext(AuthContext);
   return context;
 }

export { AuthProvider, useAuth}