import { type FC, useEffect, useRef, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

export const Document: FC = () => {
    const [text, setText] = useState("");

    const undoStack = useRef<string[]>([]);
    const redoStack = useRef<string[]>([]);
    const isUndoRedo = useRef(false);

    const [user, setUser] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const websocket = new WebSocket("ws://localhost:9995");
        wsRef.current = websocket;

        websocket.onopen = () => {
            console.log("Websocket verbunden");
        };

        websocket.onmessage = (e) => {
            const message = JSON.parse(e.data);

            switch (message.type) {
                case "document":
                case "update": {
                    if (!isUndoRedo.current) {
                        const last = undoStack.current[undoStack.current.length - 1];
                        if (last !== message.text) {
                            undoStack.current.push(message.text);
                            redoStack.current = [];
                        }
                    }

                    setText(message.text);
                    isUndoRedo.current = false;
                    break;
                }

                case "user-join":
                case "user-left":
                    setUser(message.clients);
                    break;
            }
        };

        return () => {
            websocket.close();
        };
    }, []);

    const sendWebSocketMessage = (type: string, message: string) => {
        const websocket = wsRef.current;
        if (!websocket || websocket.readyState !== WebSocket.OPEN) return;

        websocket.send(
            JSON.stringify({
                type: type,
                text: message,
            })
        );
    };

    const handleDocumentChange = (newText: string) => {
        setText(newText);
        sendWebSocketMessage("update", newText);
    };

    const handleUndo = () => {
        if (undoStack.current.length < 2) return;

        const current = undoStack.current.pop();
        const previous = undoStack.current[undoStack.current.length - 1];
        if (!previous) return;

        redoStack.current.push(current!);

        isUndoRedo.current = true;
        setText(previous);
        sendWebSocketMessage("update", previous);
    };

    const handleRedo = () => {
        if (redoStack.current.length === 0) return;

        const restored = redoStack.current.pop()!;
        undoStack.current.push(restored);

        isUndoRedo.current = true;
        setText(restored);
        sendWebSocketMessage("update", restored);
    };

    return (
        <Box m={3}>
            <TextField
                multiline
                minRows={20}
                fullWidth
                value={text}
                onChange={(e) => handleDocumentChange(e.target.value)}
            />

            <Box
                margin="auto"
                width="20%"
                mt={2}
                display="flex"
                justifyContent="space-evenly"
            >
                <Button
                    variant="contained"
                    onClick={handleUndo}
                >
                    <Typography variant="body1">Undo</Typography>
                </Button>

                <Button
                    variant="contained"
                    onClick={handleRedo}
                >
                    <Typography variant="body1">Redo</Typography>
                </Button>
            </Box>

            <Box margin="auto" width="20%" mt={2} textAlign="center">
                {user.map((u) => (
                    <Typography key={u} variant="body2">
                        {u}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};