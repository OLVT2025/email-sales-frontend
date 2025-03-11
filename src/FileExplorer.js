import { useState } from "react";

function FileExplorer(){
    const fileSystem=[
        {
            file:'src',
            type:'folder',
            children:[
                {
                    file:'index.js',
                    type:'file'
                },
            ]
        },
        {
            file:'package.json',
            type:'file',
        },
        {
            file:'README.md',
            type:'file',
        },
        {
            file:'public',
            type:'folder',
            children:[
                {
                    file:'index.html',
                    type:'file',
                    },
            ]
        }
    ]
    const [structure,setStructure]=useState(fileSystem);
    return (
        <>
            {structure.map((item)=>(
                    <div>
                        {item.file}
                    </div>
                )
            )}
        </>
    );
};
export default FileExplorer;