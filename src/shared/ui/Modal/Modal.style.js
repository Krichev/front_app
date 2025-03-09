export const styles = StyleSheet.create({
    modal: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: -1,
        pointerEvents: 'none',
    },
opened: {
    zIndex: 999,
    pointerEvents: 'auto',
},
closed: {
    zIndex: -1,
    pointerEvents: 'none',
},
overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
},
content: {
    padding: 20,
    borderRadius: 12,
    maxWidth: '60%',
},
text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
},
closeButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
},
closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
},
});