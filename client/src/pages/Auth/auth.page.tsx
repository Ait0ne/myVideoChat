import React, {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';

import SignUpForm from '../../components/SignUpForm/signUpForm.component';
import SignInForm from '../../components/SignInForm/signInForm.component';
import backgroundImage from '../../assets/background.jpeg'
import {
    AuthPageContainer, 
    AuthMainContainer, 
} from './auth.styles';
import {CustomButton} from '../../styles/styles';
import {SignInVariants} from '../../framer/variants';
import {useWindowDimensions} from '../../hooks/useWindowDimensions.hook';

export const AuthMainVariants = {
    visible: {
        // clipPath: `circle(${0.7*height}px at 50% 50%)`,
        filter: 'brightness(100%)',
        transition: {
            duration: 1.1,
            delay: 0.1
          }
    },
    hidden: {
        // clipPath: `circle(${0.55*height}px at 50% 0%)`,
        filter: 'brightness(80%)',
        transition: {
            duration: 0.8
          }
    }
}

export const svgClipPath = {
    visible: ({height, width}:{height:number, width: number}) => ({
        
        cx: `${0.5*width}px`,
        cy: `${0.5*height}px`,
        r: `${0.7*height}px`,
        transition: {
            duration: 1.1,
            delay: 0.1
          }
    }),
    hidden: ({height, width}:{height:number, width: number}) => ({
        cx: `${0.5*width}px`,
        cy: `0px`,
        r: `${height*0.55}px`,
        transition: {
            duration: 1.1,       
          }
    }),
}




const AuthPage: React.FC = () => {
    const [showSignIn, setShowSignIn] = useState(false)
    const [showSignUp, setShowSignUp] = useState(false)
    const {width, height} = useWindowDimensions()

    const rootHeight = height>900? 900 : height
    const rootWidth = width>700? 700 : width
    const toggleShowSignUp = () => {
        setShowSignUp(!showSignUp)
    }

    const toggleShowsignIn = () => {
        setShowSignIn(!showSignIn)
    }

    return (
        <AuthPageContainer>
            <motion.svg height="0" width="0">
                <defs>
                    <motion.clipPath id="clipPath">
                        <motion.circle 
                        cx={`${0.5*rootWidth}px`}
                        cy={`${0.5*rootHeight}px`}
                        r={`${0.7*rootHeight}px`}
                        animate={showSignIn||showSignUp? 'hidden': 'visible'}
                        variants={svgClipPath}
                        custom={{height:rootHeight, width: rootWidth}}
                        />
                    </motion.clipPath>
                </defs>
            </motion.svg>
            <AuthMainContainer 
            style={{backgroundImage: `url(${backgroundImage})`, clipPath: `url(#clipPath)`}}
            animate={showSignIn||showSignUp? 'hidden' : 'visible'}
            variants={AuthMainVariants}
            custom={rootHeight}
            >
                <CustomButton 
                onClick={toggleShowsignIn}
                variants={SignInVariants}
                size='lg'
                >
                    Sign In
                </CustomButton>
                <motion.span
                variants={SignInVariants}
                >
                    Don't have an account yet? <span onClick={toggleShowSignUp}>Sign Up</span> 
                </motion.span>
            </AuthMainContainer>
            <AnimatePresence exitBeforeEnter>
            {
                showSignIn?
                    <SignInForm height={rootHeight} toggleShowSignIn={toggleShowsignIn}/>
                :null
            }
                        {
                showSignUp?
                    <SignUpForm height={rootHeight} toggleShowSignIn={toggleShowSignUp}/>
                :null
            }
            </AnimatePresence>
        </AuthPageContainer>
    )
}



export default AuthPage;