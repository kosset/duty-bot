module.exports = class QuoteClient {

    constructor(){}

    _getQuoteOfTheDay(){
        throw new Error("_getQuoteOfTheDay must be overridden");
    }

    _getRandomQuotes(){
        return [];
    }

    _getQuotesByKeyword(keyword) {
        return [];
    }

    _getQuotesByAuthor(author){
        return [];
    }

    _getQuotesByCategory(category){
        return [];
    }

}