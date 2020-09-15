import React, { useState, useRef, Fragment, Dispatch } from 'react';
import {AppBar, IconButton, Typography, Menu, MenuItem} from '@material-ui/core';
import axios from 'axios';
import {connect, ConnectedProps} from 'react-redux';
import {ArrowBack, VideoCall} from '@material-ui/icons';
import {Link} from 'react-router-dom';

import {StateProps} from '../../redux/root-reducer';
import {CustomAccountIcon, CustomToolbar} from './navigation.styles';
import {FlexContainer} from '../../styles/styles';

import {setCurrentUser} from '../../redux/user/user.actions';
import {API_URL} from '../../config';
import {IUser} from '../../redux/user/user.types';

interface NavigationProps {
    backNavigation?: boolean,
    videoCallButton?: boolean,
    pageTitle?: string,
    setOutGoingCall?: React.Dispatch<React.SetStateAction<{
        channelID: string;
        connectedUserName: string;
    } | undefined>>,
    channelId?:string
}

const Navigation: React.FC<ReduxProps&NavigationProps> = ({setCurrentUser, backNavigation, videoCallButton, pageTitle, setOutGoingCall, channelId, currentUser}) => {
    const [profileMenuShown, setprofileMenuShown] = useState(false)
    const profileMenuAnchor = useRef(null)


    const toggleProfileMenu = () => {
        setprofileMenuShown(!profileMenuShown)
    }


    const handleLogout = () => {
        const token = window.localStorage.getItem('token');
        axios.post(`${API_URL}logout`, {userID: currentUser._id}, {
            headers: {"Authorization": token}
        })
        .then(() => {
            setCurrentUser(null)
            window.localStorage.removeItem('token')
        })
        .catch(() => {
            setCurrentUser(null)
            window.localStorage.removeItem('token')
        })
    }


    const handleVideoChatOpen = () =>  {
        if (setOutGoingCall&&channelId) {
            setOutGoingCall({channelID:channelId, connectedUserName: pageTitle? pageTitle: ''})
        }
    }

    return (
        <Fragment>
            <AppBar position='static'>
                <CustomToolbar>
                    <FlexContainer direction='row'>
                        {
                            backNavigation?
                            <Link to='/chatlist'>
                                <IconButton color='secondary'>
                                    <ArrowBack/>
                                </IconButton>
                            </Link>
                            : null
                        }
                        <Typography >
                            {
                                pageTitle? `${pageTitle}`: 'Contacts'
                            }
                        </Typography>
                    </FlexContainer>
                    <FlexContainer direction='row'>
                        {
                            videoCallButton?
                            <IconButton onClick={handleVideoChatOpen}>
                                <VideoCall color='secondary' fontSize='large'/>
                            </IconButton>
                            :null
                        }
                        <IconButton ref={profileMenuAnchor} edge='end' onClick={toggleProfileMenu}>
                            <CustomAccountIcon fontSize='large'/>
                        </IconButton>
                    </FlexContainer>
                </CustomToolbar>
            </AppBar>
            <Menu
            anchorEl={profileMenuAnchor.current}
            open={profileMenuShown}
            onClose={toggleProfileMenu}
            >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </Fragment>
    )
}


const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setCurrentUser: (user: IUser|null ) => dispatch(setCurrentUser(user))
})

const mapStateToProps = (state: StateProps) => ({
    currentUser:  state.user.currentUser
})

const connector = connect(mapStateToProps, mapDispatchToProps)

type ReduxProps = ConnectedProps<typeof connector>


export default connector(Navigation);