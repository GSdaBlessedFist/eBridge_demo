import { useEffect, useState } from "react";
import styles from "./configUI.module.scss";
import modeInfo from "./ configurationInfo";
import { useConfigStore } from "@/stores/useConfigStore";

function ConfigUI({ redCount, greenCount, blueCount, mode, tenMode, goal, percentages }) {
    const currentMode = modeInfo[mode];
    const options = [
        { label: "A", color: "red", count: redCount },
        { label: "B", color: "green", count: greenCount },
        { label: "C", color: "blue", count: blueCount }
    ];
    const totalVotes = redCount + greenCount + blueCount;
    const winner = options.find(opt => opt.count >= goal);

    const [lowPercentage, setLowPercentage] = useState(null)
    const [highPercentage, setHighPercentage] = useState(null)

    useEffect(() => {
        const lowPerc = Math.round(Math.min(...Object.values(percentages)))
        setLowPercentage(lowPerc)
        const hiPerc = Math.round(Math.max(...Object.values(percentages)))
        setHighPercentage(hiPerc)
    }, [percentages]);

    return (<>
        <div className={styles.uiFrame}>
            <div className={styles.modules}>

                {/* INFO MODULE */}
                <div className={styles.moduleInfo}>
                    <div className={styles.configurationModeSection}>{tenMode ? "ACTIVE_ONLY" : currentMode.title}</div>
                    <div className={styles.configurationInfoSection}>
                        {tenMode ? modeInfo["ACTIVE_ONLY"].description : currentMode.description}
                    </div>
                    <div className={styles.configurationDataSection}></div>
                </div>

                {/* HERO MODULE */}
                <div className={styles.moduleHero}>
                    <div className={styles.heroSpacer}>
                        <div>
                            <div>LOW</div>
                            <div>{lowPercentage < 0 ? 0 : lowPercentage}%</div>
                        </div>
                    </div>
                    <div className={styles.centerSection}>
                        <div className={styles.raceToTenSection} style={{ opacity: tenMode ? 1 : 0.4 }}>Race to Ten</div>
                        <div className={styles.visualSection}>
                            {options.map((option, i) => {

                                const percentValue = percentages?.[option.color] ?? 0;

                                const normalizedFill = tenMode
                                    ? option.count
                                    : Math.round((percentValue / 100) * goal);

                                return (
                                    <div key={i} className={styles.visualsColumns}>
                                        <div className={styles.entireBar}>
                                            {Array.from({ length: goal }).map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className={
                                                        idx < normalizedFill
                                                            ? styles.activeBar
                                                            : styles.bar
                                                    }
                                                />
                                            ))}
                                        </div>

                                        <div className={styles.labelGroup}>
                                            <div className={styles.optionLabel}>
                                                Option {option.label}
                                            </div>

                                            <div className={styles.fractions}>
                                                {/* {option.count}/{goal} */}
                                                {option.count}/{tenMode ? goal : totalVotes}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className={styles.heroSpacer}>
                        <div>
                            <div>HIGH</div>
                            <div>{highPercentage < 0 ? 0 : highPercentage}%</div>
                        </div>

                    </div>
                </div>

                {/* MODULE RESULTS */}
                <div className={styles.moduleResults}>
                    <div className={styles.resultsTopSection}>
                        <div className={styles.resultsSpacer}></div>
                        <div className={styles.resultsMain}>
                            {options.map((option, i) => {

                                const livePercentage = (percentages?.[option.color] || 0);

                                const normalized = livePercentage / 100;

                                const filledBars = tenMode
                                    ? option.count
                                    : Math.round(normalized * goal);

                                const tenPercentage = option.count / goal;

                                const percentage = tenMode
                                    ? tenPercentage
                                    : normalized;

                                // console.log({
                                //     label: option.label,
                                //     tenMode,
                                //     optionCount: option.count,
                                //     normalized,
                                //     filledBars
                                // });

                                return (
                                    <div key={i} className={styles.resultLabelGroup}>
                                        <div className={styles.resultLabel}>Option</div>

                                        <div
                                            className={styles.resultOption}
                                            style={{
                                                opacity: 0.3 + percentage * 0.7
                                            }}
                                        >
                                            {option.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.resultsSpacer}></div>
                    </div>
                    <div className={winner ? styles.resultsWinnerFound : styles.resultsWinnerSection}>
                        {winner ? `Option ${winner.label}` : "--"}
                    </div>
                </div>
            </div>
        </div>
    </>
    );
}
export default ConfigUI;
