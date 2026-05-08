import { 
    ActivityIndicator, 
    StyleSheet, 
    Text, 
    View 
} from "react-native";

const C_BG = "#0f1724";
const C_TEXT2 = "#90a4ae";

export const LoadingTramitesSpinner: React.FC = () => {
    return(
        <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00bfa5" />
                <Text style={styles.loadingText}>Cargando trámites...</Text>
              </View>
    )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C_BG,
  },
  loadingText: {
    color: C_TEXT2,
    marginTop: 12,
    fontSize: 14,
  }
});