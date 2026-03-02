const p = function (sourceName, line, hue = [25, 50], data, variableName = "") {
    const color = `hsl(${hue[0]},100%,${hue[1] || 50}%)`;
    const dimmedColor = `hsl(${hue[0]},80%,${hue[1] || 30}%)`;


    //example::  const SOURCE = "Render Page";// "Render Page off";
    //the console.log is turned off
    //usage: p(SOURCE,linen,srcColor,variable,"variableName:")

    if (sourceName.includes("off")) {
        return;
    } else {
        if (typeof data === "object") {
            if (Array.isArray(data)) {
                console.log(
                    `%c${sourceName} [${line}]: %c${variableName}:`,
                    `font-weight:bold;color:${color};
             font-size:1.15rem;`,
                    `font-weight:normal;color:${dimmedColor};
             font-size:1.05rem;`, data
                );
                console.table(data)
            } else {
                console.log(
                    `%c${sourceName}[${line}]: %c${variableName}: `,
                    `font-weight:bold;color:${color};
             font-size:1.15rem;`,
                    `font-weight:normal;color:${dimmedColor};
             font-size:1.05rem;`,
                );
                console.log(data)
            }
        } else {
            console.log(
                `%c${sourceName}[${line}]: %c${variableName}: %s`,
                `font-weight:bold;color:${color};
           font-size:1.15rem;`,
                `font-weight:normal;color:${color};
          font-size:1.05rem;`,
                data
            );
        }
    }

};

module.exports = p;