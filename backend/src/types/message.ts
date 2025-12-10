export type Message = {
    type: string,
    text: string,
}

export type UserMessage = {
    type: string,
    clients: string[],
}