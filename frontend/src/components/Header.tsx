import type {FC} from "react";
import {AppBar, Toolbar, Typography} from "@mui/material";
import {lightBlue} from "@mui/material/colors";

export const Header: FC = () => {
    return (
        <header>
            <AppBar position="static" sx={{ background: lightBlue["800"] }}>
                <Toolbar>
                    <Typography
                        component="h1"
                        variant="h3"
                    >
                        Editor
                    </Typography>
                </Toolbar>
            </AppBar>
        </header>
    );
}