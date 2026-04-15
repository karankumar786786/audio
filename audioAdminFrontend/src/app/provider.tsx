"use client"

import {Auth0Provider} from "@auth0/auth0-react";


import React from 'react'

function Provider({children}:{children:React.ReactNode}) {
  return (
    <Auth0Provider
    domain=""
    clientId=""
    authorizationParams={{
        redirect_uri: typeof window !== "undefined" ? window.location.origin + "/callback" : "",
        scope: "openid profile email",
    }}
    >
        {children}
    </Auth0Provider>
  )
}

export default Provider