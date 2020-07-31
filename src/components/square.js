import React from 'react'

export default function Square({mark, onClick, pos}) {
    return (
        <div style={{
            border: "1px black solid",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }} onClick={() => {
            onClick(pos);
        }}>
            {mark ? mark:""}
        </div>
    )
}
