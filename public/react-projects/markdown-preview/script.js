class MarkdownApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            text: "**bold** text"
        }
        this.handleChange = this.handleChange.bind(this);
        this.markdown = this.markdown.bind(this);
    }

    handleChange() {
        this.setState({ text: this.refs.textarea.value });
    }

    markdown() {
        return { __html: marked(this.state.text) };
    }

    render() {
        return (
            <div>
                <textarea rows="10" className="raw" ref="textarea" onChange={this.handleChange} defaultValue={this.state.text} />
                <div className="md" dangerouslySetInnerHTML={this.markdown()} />
            </div>
        );
    }
}


ReactDOM.render(<MarkdownApp />, document.getElementById("root"));
