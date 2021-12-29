import React, { useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import Redirect from 'react-router-dom';

import { logout } from "../services/auth-service";

const Logout = () => {
    logout();
    return (
        <></>
    );
}

export default Logout;
