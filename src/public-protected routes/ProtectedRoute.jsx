import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import API from '../services/API';
import { getCurrentUser } from '../redux/features/auth/authActions';
import { Navigate } from 'react-router-dom';
import { protectedRoutes } from './protected';
import { useRoutes } from 'react-router-dom';

const ProtectedRoute = () => {
    const element = useRoutes([...protectedRoutes]);
    const authUser = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();


    // get current user
    const getUser = async () => {
        try {
            const { data } = await API.get('/user/current-user');
            // todo: this if check may not be required caz axios will throw error if status is not 2xx
            if (data?.status === 'success') {
                // dispatch(getCurrentUser(data));
                // this should fix the double api calls
                dispatch(data);
            }
        } catch (error) {
            localStorage.clear();
            console.log(error);
        }
    };

    useEffect(() => {
        // Dispatch getCurrentUser only if auth.user is null
        if (!authUser) {
            getUser();
        }
    }, [dispatch, authUser]);

    if (localStorage.getItem('token')) {
        return <>{element}</>;
    } else {
        return <Navigate to="/login" />;
    }
};

export default ProtectedRoute;
