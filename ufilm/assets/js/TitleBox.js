var $ = require('jquery');
var React = require('react');
var Popover = require('react-bootstrap/lib/Popover');
var OverlayTrigger = require('react-bootstrap/lib/OverlayTrigger');
var Modal = require('react-bootstrap/lib/Modal');
var Button = require('react-bootstrap/lib/Button');


var TitleBox = React.createClass({
    getInitialState: function(){
        return {
            popoverIsOpen: true,
            popoverPlacement: 'top',
            showModal: false
        }
    },
    componentDidMount: function(){
        var node_position = $(this.getDOMNode()).offset();
        var window_width = $(window).width();
        this.setState({
            popoverPlacement: (window_width / 2) > node_position.left ? 'right' : 'left'
        });
    },
    openModal: function(){
        this.setState({
            showModal: true
        });
    },
    closeModal: function(){
        this.setState({
            showModal: false
        });
    },
    render: function(){
        return <div style={{width: this.props.width, height: this.props.height, float: "left", margin: "0px"}}>
            <OverlayTrigger trigger={['hover']} placement={this.state.popoverPlacement} overlay={
                <Popover title={this.props.title.title}>
                    <p>{truncate(this.props.title.description, 300)}</p>
                    <strong>{this.props.title.grade} ({this.props.title.votes}) | {this.props.title.runtime} min {this.props.title.rating_label ? " | "+this.props.title.rating_label : ""} </strong>
                </Popover>
            }>
                
                <div>
                    <a href="javascript:;" onClick={this.openModal}>
                        <img className="img-thumbnail" src={this.props.title.small_cover_url} />
                    </a>

                    <FilmModal 
                        item={this.props.title} 
                        show={this.state.showModal} 
                        onHide={this.closeModal} 
                    />
                </div>
            </OverlayTrigger>
        </div>
    }
});

var Tag = React.createClass({
    render(){
        var field = this.props.names.length > 0 ? 
            this.props.names.map(
                (tag, i) => tag.name
            ).join(", ") : "";
        if( field ){
            return (
                <p>
                    <strong>{this.props.label}&nbsp;</strong>
                    <span>{field}</span>
                </p>
            );
        }else{
            return false;
        }
    }
});

function truncate(string, max_length=100){
    if( string && string.length > max_length ){
        return string.substring(0,max_length)+'...';
    }else{
        return string;
    }
}

var FilmModal = React.createClass({
    render() {
        return (
          <Modal {...this.props} dialogClassName='custom-modal'>

            <Modal.Body>
                <Button onClick={this.props.onHide}>x</Button>
                <div className="col-xs-5">
                    <img src={this.props.item.big_cover_url} />
                </div>
                <div className="col-xs-6" style={{minHeight: "330px"}}>
                    <h4>{this.props.item.title} ({this.props.item.year})</h4>
                    <h5>{this.props.item.grade} ({this.props.item.votes}) | {this.props.item.runtime} min {this.props.item.rating_label ? "| "+this.props.item.rating_label : ""} | <a target="_blank" href={this.props.item.imdb_url}>IMDb</a></h5>

                    <Tag label='Director(s):' names={this.props.item.directors} />
                    <Tag label='Writer(s):' names={this.props.item.writers} />
                    <Tag label='Star(s):' names={this.props.item.stars} />

                    <p>{truncate(this.props.item.description, 400)}</p>

                    <Tag label='Genre(s):' names={this.props.item.genres} />
                
                </div>
                <Button onClick={this.props.onHide}>Close</Button>
            </Modal.Body>


          </Modal>
        );
    }
});

module.exports = TitleBox
