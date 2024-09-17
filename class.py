class uddannelse:
    def __init__(self, titel, steder, afbrud, afbrud_n, leddighednyuddannet, leddighednyuddannet_n):
        self.titel = titel
        self.steder = steder
        self.afbrud = afbrud
        self.afbrud_n = afbrud_n
        self.leddighednyuddannet = leddighednyuddannet
        self.leddighednyuddannet_n = leddighednyuddannet_n

    def __repr__(self):
        print(
            f'titel: {self.titel}\n'
            f'steder: {self.steder}\n'
            f'afbrud: {self.afbrud}\n'
            f'afbrud_n: {self.afbrud_n}\n'
            f'leddighednyuddannet: {self.leddighednyuddannet}\n'
            f'leddighednyuddannet_n: {self.leddighednyuddannet_n}\n'
        )