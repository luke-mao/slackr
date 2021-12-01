'use strict';

import { checkAuthStatus } from "./auth.js";
import { onHashChange } from "./fragmentUrl.js";

// check the token, then render either home page or login page.
checkAuthStatus();

// listen to the url hash change.
window.onhashchange = onHashChange;

