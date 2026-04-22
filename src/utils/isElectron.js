export const isElectron = () => {
    return typeof window !== 'undefined' && !!window.electron;
};