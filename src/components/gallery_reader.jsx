import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { getBookById } from "../actions";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import _ from "lodash";
import { PageLoader } from "./page_loader";
import { BackButton } from "./back_button";

import { ImageLoader } from "./image-loader";

class GalleryReader extends Component {
    constructor(props) {
        super(props);

        this.computeImageUrl = this.computeImageUrl.bind(this);
        this.computePageLink = this.computePageLink.bind(this);
        this.preloadImage = this.preloadImage.bind(this);
        this.preloadArr = []; // the preload image queue

        const backpath = _.get(props, "location.state.backpath", "/");

        // if no data in state , go fetch data by id
        // if there's data remains , set it to the state
        if (!_.get(this.state,"images",null)) {
            this.props.getBookById(props.match.params.id);
            this.state = {
                backpath
            };
        } else {
            this.state = {
                images: props.location.state.images,
                page: props.match.params.page,
                media_id: props.location.state.media_id,
                id:props.match.params.id,
                backpath
            };
        }
    }

    static getDerivedStateFromProps(nextProps) {
        // keep state if contains
        if(typeof nextProps.media_id === "undefined"){
            return null;
        }

        // state setting while receive props from actions
        return {
            images: nextProps.images,
            page: nextProps.match.params.page,
            media_id: nextProps.media_id,
            id: nextProps.match.params.id
        };
    }

    computeImageUrl() {
        // make the image src url to show it 
        const page = this.state.page;
        const image_type = { j: "jpg", p: "png", g: "gif" };
        const this_type = this.state.images[page - 1].t;

        return `https://i.nhentai.net/galleries/${this.state.media_id}/${this.state.page}.${image_type[this_type]}`;
    }

    computePageLink(page) {
        // make the url of back path
        const gallery_length = this.state.images.length;
        if (page < 1 || page > gallery_length) {
            return `/g/${this.state.id}`;
        } else {
            return `/g/${this.state.id}/${page}`;
        }
    }

    preloadImage() {
        // image preloading function
        // up to 3 images
        this.preloadArr.pop();
        const current_page = parseInt(this.state.page); // the page user at

        let page = parseInt(this.state.page) + this.preloadArr.length + 1; // page to preload
        while (page <= this.state.images.length && this.preloadArr.length < 3) {

            const image_type = { j: "jpg", p: "png", g: "gif" };
            const this_type = this.state.images[page - 1].t;

            let image = new Image();
            image.src = `https://i.nhentai.net/galleries/${this.state.media_id}/${page}.${image_type[this_type]}`;
            this.preloadArr.unshift(image);
            page = current_page + this.preloadArr.length + 1;
        }
    }

    render() {
        console.log("render",this.state)
        // show a loading text while fetching data
        if (!this.state.images || this.state.images.length === 0) {
            return <PageLoader />;
        }
        return (
            <div>
                <Link to={{ pathname: `/g/${this.props.id}`, state: { backpath: this.state.backpath } }}>
                    <BackButton />
                </Link>
                <p className="reader-img-counter">{this.state.page} / {this.state.images.length}</p>
                <div className="reader-img-container">
                    <Link to={{ pathname: this.computePageLink(parseInt(this.state.page) - 1), backpath: this.state.backpath }}>
                        <div className="reader-img-left" />
                    </Link>
                    <Link to={{ pathname: this.computePageLink(parseInt(this.state.page) + 1), backpath: this.state.backpath }}>
                        <div className="reader-img-right" />
                    </Link>
                    <ImageLoader src={this.computeImageUrl()} onLoad={this.preloadImage} />
                </div>
                <p className="reader-img-counter">{this.state.page} / {this.state.images.length}</p>
            </div>
        );
    }
}

function mapStateToProps(state) {
    if (!state.book.images) {
        return { images: [] };
    }
    const images = state.book.images.pages || [];
    const id = state.book.id;
    return { images, media_id: state.book.media_id, id: id.toString() };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ getBookById }, dispatch);
}

GalleryReader.propTypes = {
    location: PropTypes.shape({
        state: PropTypes.shape({
            media_id: PropTypes.string,
            backpath: PropTypes.string,
            images: PropTypes.arrayOf(PropTypes.object)
        })
    }),
    match: PropTypes.shape({
        params: PropTypes.shape({
            id: PropTypes.string,
            page: PropTypes.string
        })
    }),
    images: PropTypes.arrayOf(PropTypes.object),
    media_id: PropTypes.string,
    id: PropTypes.string,
    getBookById: PropTypes.func
};

export default connect(mapStateToProps, mapDispatchToProps)(GalleryReader);