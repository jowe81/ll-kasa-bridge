import React, {useRef, useEffect} from "react";

const Graph = ({ dataset, limitYRange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // dataset = [
    //     { x: 2, y: 7 },
    //     { x: 3, y: 0 },
    //     { x: 5, y: 0 },
    //     { x: 6, y: 4 },
    //     { x: 7, y: 7 },
    //     { x: 8, y: 7 },
    //     { x: 9, y: 5 },
    //     { x: 10, y: 6 },
    //     { x: 11, y: 3 },
    // ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        
        if (!(context && Array.isArray(dataset) && dataset.length > 2)) {
            return;
        }

        context.clearRect(0, 0, canvas?.width, canvas.height);
        
        let minX = getLowestValue(dataset, 'x');
        let minY = limitYRange ? getLowestValue(dataset, 'y') : 0;
        let maxX = getHighestValue(dataset, 'x');
        let maxY = getHighestValue(dataset, 'y');

        // Go to first point.
        const point = dataPointToCanvasCoordinates(dataset[0], canvas?.width, canvas?.height - 15, minX, maxX, minY, maxY);            
        context.moveTo(point.x, point.y);

        // Connect to the next points.
        dataset.forEach(dataPoint => {
            const point = dataPointToCanvasCoordinates(dataPoint, canvas?.width, canvas?.height - 15, minX, maxX, minY, maxY);            
            context.lineTo(point.x, point.y);
            context.stroke();
            context.strokeStyle = "#FFAA00";
        });

        drawLabels(context, canvas?.width, canvas?.height - 15, minX, maxX, minY, maxY, 10, 5, 0, 0);
    }, []);

    return (
        <canvas className="chore-graph" ref={canvasRef} width={280} height={110}/>
    );
};


function drawLabels(context, canvasWidth, canvasHeight, minX, maxX, minY, maxY, maxLabelsX = 0, maxLabelsY = 0, padX = 0, padY = 0) {
    context.font = 'bold 12px Arial';
    context.fillStyle = '#CCC';

    // If no maximum # of labels is set, show them all.
    let stepX = maxLabelsX ? Math.ceil((maxX - minX) / maxLabelsX) : 1;
    let stepY = maxLabelsY ? Math.ceil((maxY - minY) / maxLabelsY) : 1;

    if (!stepX) {
        stepX = 1;
    }

    if (!stepY) {
        stepY = 1;
    }

    // Y axis
    let current = minY + padY;
    while(current <= maxY - padY) {        
        const point = dataPointToCanvasCoordinates({x: 0, y: current}, canvasWidth, canvasHeight, minX, maxX, minY, maxY);
        context.fillText(current.toFixed(), 5, point.y + 3);
        current += stepY;
    }

    // X axis
    current = minX + padX;
    while(current <= maxX - padX) {        
        const point = dataPointToCanvasCoordinates({x: current, y: 0}, canvasWidth, canvasHeight, minX, maxX, minY, maxY);
        context.fillText(current, point.x, canvasHeight + 12);
        current += stepX;
    }

}

const getHighestValue = (dataset, key, pad = 0) => getBoundingValue(dataset, key, true, pad);
const getLowestValue = (dataset, key, pad = 0) => getBoundingValue(dataset, key, false, pad);

function getBoundingValue(dataset, key, highest, pad) {
    if (!Array.isArray(dataset) || !key) {
        return null;
    }

    let value = null;

    dataset.forEach(dataPoint => {
        if (value === null) {
            value = dataPoint[key];
        }

        if (highest) {
            if (value < dataPoint[key]) {
                value = dataPoint[key];
            }
        } else {
            if (value > dataPoint[key]) {
                value = dataPoint[key];
            }
        }    
    })

    if (!isNaN(value) && pad) {
        highest ? value += pad : value -= pad;
    }

    return value;
}

function dataPointToCanvasCoordinates(dataPoint, canvasWidth, canvasHeight, minX, maxX, minY, maxY) {
    /**
     *  The difference between minX/maxX needs to be scaled to height, same for minY/maxY and width, respectively. 
     * 
     **/   

    const marginY = 10;
    const marginX = 15;

    canvasWidth = canvasWidth - 2 * marginX;
    canvasHeight = canvasHeight - 2 * marginY;

    const scaleX = canvasWidth / (maxX - minX);
    const canvasX = (dataPoint.x - minX) * scaleX;
    const scaleY = canvasHeight / (maxY - minY);
    const canvasY = canvasHeight - (dataPoint.y - minY) * scaleY;
    return {
        x: marginX + canvasX,
        y: marginY + canvasY,
    }    
}

export default Graph;
