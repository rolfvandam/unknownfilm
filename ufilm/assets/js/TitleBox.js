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
        let node_position = $(this.getDOMNode()).offset();
        let window_width = $(window).width();
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

    getImageWidth: function(){
        return this.props.go_big ? 
            this.props.title.big_cover.width : this.props.title.small_cover.width;
    },

    getImageHeight: function(){
        return this.props.go_big ? 
            this.props.title.big_cover.height : this.props.title.small_cover.height;
    },
    
    getImageUrl: function(){
        return this.props.go_big ? 
            this.props.title.big_cover.url : this.props.title.small_cover.url
    },

    render: function(){
        return <div style={ {
                    float: "left", 
                    margin: "0px", 
                    width: this.getImageWidth()+"px",
                    height: this.getImageHeight()+"px",
                    backgroundImage: "url('/static/spinner.gif')",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}>
            <OverlayTrigger trigger={['hover']} placement={this.state.popoverPlacement} overlay={
                <Popover title={this.props.title.title + " (" + this.props.title.year + ")"}>
                    <p>{truncate(this.props.title.description, 300)}</p>
                    <strong>{this.props.title.grade} ({this.props.title.votes}) | {this.props.title.runtime} min {this.props.title.rating_label ? " | "+this.props.title.rating_label : ""} </strong>
                </Popover>
            }>
                
                <div>
                    <a href="javascript:;" onClick={this.openModal}>
                        <img 
                            className="img-thumbnail"
                            width={this.getImageWidth()}
                            height={this.getImageHeight()}
                            src={this.getImageUrl()} 
                        />
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

    render: function(){
        let field = this.props.names.length > 0 ? 
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

    render: function() {
        return (
          <Modal {...this.props} dialogClassName='custom-modal'>

            <Modal.Body>
                <div className="container-fluid film-modal">
                <Button onClick={this.props.onHide}>x</Button>
                <div className="col-xs-12 col-lg-5">
                    <img 
                        width={this.props.item.big_cover.width} 
                        height={this.props.item.big_cover.height} 
                        src={this.props.item.big_cover.url} 
                    />
                </div>
                <div className="col-xs-12 col-lg-6" style={{minHeight: "330px"}}>
                    <h4>{this.props.item.title} ({this.props.item.year})</h4>
                    <h5>{this.props.item.grade} ({this.props.item.votes}) | {this.props.item.runtime} min {this.props.item.rating_label ? "| "+this.props.item.rating_label : ""} | <a target="_blank" href={this.props.item.imdb_url}>IMDb</a></h5>

                    <Tag label='Director(s):' names={this.props.item.directors} />
                    <Tag label='Writer(s):' names={this.props.item.writers} />
                    <Tag label='Star(s):' names={this.props.item.stars} />

                    <p>{truncate(this.props.item.description, 400)}</p>

                    <Tag label='Genre(s):' names={this.props.item.genres} />
                </div>
                <br />
                <div className="col-xs-12">
                    <div>
                    <strong><a target="_blank" href={ 
                        "http://www.amazon.com/s?"+$.param({
                            ie:"UTF8",
                            x:0,
                            ref_:"nb_sb_ss_i_0_16",
                            y:0,
                            "field-keywords":this.props.item.title+" "+this.props.item.year,
                            tag:"unknfilm-20",
                            url:"search-alias>dvd",
                            sprefix:this.props.item.title+" "+this.props.item.year
                        })
                    }>
                        Look for "{this.props.item.title+" "+this.props.item.year}" on Amazon.com
                    </a></strong>
                    </div>
                    <div>
                    <strong><a target="_blank" href={ 
                        "http://www.youtube.com/results?"+$.param({
                            search_query: this.props.item.title + " " + this.props.item.year + " trailer"
                        })
                    }>
                        Look for "{this.props.item.title+" "+this.props.item.year+" trailer"}" on YouTube.com
                    </a></strong>

                    </div>
                    <br />
                </div>
                <Button onClick={this.props.onHide}>Close</Button>
                </div>
            </Modal.Body>


          </Modal>
        );
    }

});

module.exports = TitleBox;
