import styles from "./configUI.module.scss";
function ConfigUI() {
    return (
        <div className={styles.frame}>
            <div className={styles.uiGrid}>
                <div className={styles.main}>main</div>
                <div className={styles.additional}>additional</div>
                <div className={styles.number}>number</div>
            </div>
        </div>
    );
}
export default ConfigUI;